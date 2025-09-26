import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import { TrialSummary, TrialDetail, Filters } from './models';

@Injectable({ providedIn: 'root' })
export class TrialsService {
  private apiUrl = 'https://clinicaltrials.gov/api/v2/studies';

  private trialsSubject = new BehaviorSubject<TrialSummary[]>([]);
  trials$ = this.trialsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private followedSubject = new BehaviorSubject<Set<string>>(new Set());
  followed$ = this.followedSubject.asObservable();

  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const saved = localStorage.getItem('followedTrials');
      if (saved) {
        this.followedSubject.next(new Set(JSON.parse(saved)));
      }
    }
  }

  searchTrials(filters: Filters) {
    this.loadingSubject.next(true);

    let params = new HttpParams()
      .set('pageSize', String(filters.pageSize ?? 20));
    if (filters.q) {
      params = params.set('query.cond', filters.q);
    }
    if (filters.status) {
      params = params.set('filter.overallStatus', filters.status);
    }
    if (filters.phase) {
      params = params.set('filter.phase', filters.phase);
    }

    params = params.set(
      'fields',
      'NCTId,BriefTitle,OverallStatus,Phase,Condition'
    );

    console.log('API Query params:', params.toString());

    this.http
      .get<any>(this.apiUrl, { params })
      .pipe(
        catchError((err) => {
          console.error('Error fetching trials:', err);
          console.error('Request URL:', `${this.apiUrl}?${params.toString()}`);
          this.trialsSubject.next([]);
          this.loadingSubject.next(false);
          return of(null);
        }),
        tap(() => this.loadingSubject.next(false))
      )
      .subscribe((resp) => {
        console.log('API Response:', resp);

        if (!resp || !resp.studies) {
          console.log('No studies found in response');
          this.trialsSubject.next([]);
          return;
        }

        const mapped: TrialSummary[] = resp.studies.map((study: any) => {
          console.log('Processing study:', study);

          const protocolSection = study.protocolSection;
          const identificationModule = protocolSection?.identificationModule;
          const statusModule = protocolSection?.statusModule;
          const designModule = protocolSection?.designModule;
          const conditionsModule = protocolSection?.conditionsModule;

          return {
            nctId: identificationModule?.nctId || study.nctId || 'N/A',
            title: identificationModule?.briefTitle || 'No title available',
            phase: designModule?.phases?.join(', ') || 'N/A',
            status: statusModule?.overallStatus || 'Unknown',
            condition: conditionsModule?.conditions?.join(', ') || 'No condition specified'
          };
        });

        console.log('Mapped trials:', mapped);
        this.trialsSubject.next(mapped);
      });
  }

  getTrial(nctId: string) {
    this.loadingSubject.next(true);

    this.http
      .get<any>(`${this.apiUrl}/${nctId}`)
      .pipe(
        catchError((err) => {
          console.error('Error fetching trial detail:', err);
          this.loadingSubject.next(false);
          return of(null);
        }),
        tap(() => this.loadingSubject.next(false))
      )
      .subscribe((resp) => {
        if (!resp || !resp.protocolSection) return;

        const protocolSection = resp.protocolSection;
        const identificationModule = protocolSection.identificationModule;
        const statusModule = protocolSection.statusModule;
        const designModule = protocolSection.designModule;
        const conditionsModule = protocolSection.conditionsModule;
        const descriptionModule = protocolSection.descriptionModule;
        const eligibilityModule = protocolSection.eligibilityModule;
        const contactsLocationsModule = protocolSection.contactsLocationsModule;
        const sponsorCollaboratorsModule = protocolSection.sponsorCollaboratorsModule;

        const detail: TrialDetail = {
          nctId: identificationModule?.nctId || 'N/A',
          title: identificationModule?.briefTitle || 'No title available',
          status: statusModule?.overallStatus || 'Unknown',
          phase: designModule?.phases?.join(', ') || 'N/A',
          condition: conditionsModule?.conditions?.join(', ') || 'No condition specified',
          description: descriptionModule?.briefSummary || 'No description available',
          eligibility: eligibilityModule?.eligibilityCriteria || 'No eligibility info',
          locations: contactsLocationsModule?.locations || [],
          sponsor: sponsorCollaboratorsModule?.leadSponsor?.name || 'Unknown sponsor',
        };

        console.log('Detail fetched:', detail);
      });
  }

  toggleFollow(nctId: string) {
    const current = new Set(this.followedSubject.value);
    if (current.has(nctId)) {
      current.delete(nctId);
    } else {
      current.add(nctId);
    }
    this.followedSubject.next(current);
    if (this.isBrowser) {
      localStorage.setItem(
        'followedTrials',
        JSON.stringify(Array.from(current))
      );
    }
  }

  getCurrentFollowed(): Set<string> {
    return this.followedSubject.value;
  }
}
