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

  private totalResultsSubject = new BehaviorSubject<number>(0);
  totalResults$ = this.totalResultsSubject.asObservable();

  private trialDetailSubject = new BehaviorSubject<TrialDetail | null>(null);
  trialDetail$ = this.trialDetailSubject.asObservable();

  private pageTokens: string = '';
  currentPageIndex = 0;

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

    let params = new HttpParams().set('countTotal', 'true')
      .set('pageSize', String(filters.pageSize ?? 20));

    const token = this.pageTokens;
    if (token) {
      params = params.set('pageToken', token);
    }

    if (filters.q) {
      params = params.set('query.cond', filters.q);
    }
    if (filters.status) {
      params = params.set('filter.overallStatus', filters.status);
    }
    if (filters.phase) {
      let phaseValue = filters.phase;
      if (phaseValue === 'PHASE1') phaseValue = '1';
      else if (phaseValue === 'PHASE2') phaseValue = '2';
      else if (phaseValue === 'PHASE3') phaseValue = '3';
      else if (phaseValue === 'PHASE4') phaseValue = '4';
      else if (phaseValue === 'NA') phaseValue = 'N/A';

      params = params.set('aggFilters', `phase:${phaseValue}`);
    }

    params = params.set(
      'fields',
      'NCTId,BriefTitle,OverallStatus,Phase,Condition'
    );


    this.http
      .get<any>(this.apiUrl, { params })
      .pipe(
        catchError((err) => {
          console.error('Error fetching trials:', err);
          console.error('Request URL:', `${this.apiUrl}?${params.toString()}`);
          this.trialsSubject.next([]);
          this.totalResultsSubject.next(0);
          this.loadingSubject.next(false);
          return of(null);
        }),
        tap(() => this.loadingSubject.next(false))
      )
      .subscribe((resp) => {

        console.log(resp, params);

        if (!resp || !resp.studies) {
          console.log('No studies found in response');
          this.trialsSubject.next([]);
          this.totalResultsSubject.next(0);
          return;
        }

        if (resp.nextPageToken) {
          this.pageTokens = resp.nextPageToken;
        }

        this.totalResultsSubject.next(
          resp.totalCount
        );

        const mapped: TrialSummary[] = resp.studies.map((study: any) => {

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

        this.trialsSubject.next(mapped);

        if (filters.pageNumber !== undefined && resp.nextPageToken) {
          this.pageTokens = resp.nextPageToken;
        }
      });
  }

  getTrial(nctId: string) {
    this.loadingSubject.next(true);
    this.trialDetailSubject.next(null);

    this.http
      .get<any>(`${this.apiUrl}/${nctId}`)
      .pipe(
        catchError((err) => {
          console.error('Error fetching trial detail:', err);
          this.loadingSubject.next(false);
          this.trialDetailSubject.next(null);
          return of(null);
        }),
        tap(() => this.loadingSubject.next(false))
      )
      .subscribe((resp) => {
        if (!resp || !resp.protocolSection) {
          this.trialDetailSubject.next(null);
          return;
        }

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
          nctId: identificationModule?.nctId || nctId,
          title: identificationModule?.briefTitle || 'No title available',
          status: statusModule?.overallStatus || 'Unknown',
          phase: designModule?.phases?.join(', ') || 'N/A',
          condition: conditionsModule?.conditions?.join(', ') || 'No condition specified',
          description: descriptionModule?.briefSummary || 'No description available',
          eligibility: eligibilityModule?.eligibilityCriteria || 'No eligibility information available',
          locations: contactsLocationsModule?.locations || [],
          sponsor: sponsorCollaboratorsModule?.leadSponsor?.name || 'Unknown sponsor',
        };

        console.log('Detail fetched:', detail);
        this.trialDetailSubject.next(detail);
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
