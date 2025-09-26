import { Component, OnInit, OnDestroy } from '@angular/core';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TrialsService } from '../../core/trials.service';
import { Observable, Subject, combineLatest, map, takeUntil } from 'rxjs';
import { TrialSummary, Filters } from '../../core/models';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { StatusIndicator } from '../../shared/components/status-indicator/status-indicator';

@Component({
  selector: 'app-trials-list',
  templateUrl: './trials-list.html',
  styleUrls: ['./trials-list.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    AsyncPipe,
    NgIf,
    NgFor,
    RouterModule,
    StatusIndicator
  ]
})
export class TrialsListComponent implements OnInit, OnDestroy {
  trials$: Observable<TrialSummary[]>;
  followed$: Observable<Set<string>>;
  loading$: Observable<boolean>;
  totalResults$: Observable<number>;

  displayedTrials: TrialSummary[] = [];
  displayedColumns = ['nctId', 'title', 'phase', 'status', 'condition', 'follow'];

  showOnlyFollowed = false;
  currentFilters: Filters = { q: '', status: '', phase: '', pageSize: 20 };

  totalResults = 0;
  pageIndex = 0;
  pageSize = 20;
  pageSizeOptions = [10, 20, 50, 100];

  private destroy$ = new Subject<void>();

  private readonly statusDisplayMap: { [key: string]: string } = {
    'RECRUITING': 'Recruiting',
    'NOT_YET_RECRUITING': 'Not yet recruiting',
    'ACTIVE_NOT_RECRUITING': 'Active, not recruiting',
    'COMPLETED': 'Completed',
    'TERMINATED': 'Terminated',
    'SUSPENDED': 'Suspended',
    'WITHDRAWN': 'Withdrawn',
    'ENROLLING_BY_INVITATION': 'Enrolling by invitation'
  };

  private readonly phaseDisplayMap: { [key: string]: string } = {
    'NA': 'N/A',
    'PHASE1': 'Phase 1',
    'PHASE2': 'Phase 2',
    'PHASE3': 'Phase 3',
    'PHASE4': 'Phase 4',
    'PHASE1, PHASE2': 'Phase 1/Phase 2',
    'PHASE2, PHASE3': 'Phase 2/Phase 3',
    'EARLY_PHASE1': 'Early Phase 1',
    'NOT_APPLICABLE': 'Not Applicable'
  };

  constructor(private trialsService: TrialsService) {
    this.trials$ = this.trialsService.trials$;
    this.followed$ = this.trialsService.followed$;
    this.loading$ = this.trialsService.loading$;
    this.totalResults$ = this.trialsService.totalResults$;
  }

  ngOnInit() {
    this.trialsService.searchTrials({ q: '' });

    this.totalResults$.pipe(takeUntil(this.destroy$)).subscribe(total => {
      this.totalResults = total;
    });

    combineLatest([
      this.trials$,
      this.followed$
    ]).pipe(
      takeUntil(this.destroy$),
      map(([trials, followed]) => {
        if (this.showOnlyFollowed) {
          return trials.filter(trial => followed.has(trial.nctId));
        }
        return trials;
      })
    ).subscribe(filteredTrials => {
      this.displayedTrials = filteredTrials;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(query: string) {
    this.currentFilters.q = query.trim();
    this.applyFilters();
  }

  onStatusFilter(status: string) {
    this.currentFilters.status = status;
    this.applyFilters();
  }

  onPhaseFilter(phase: string) {
    this.currentFilters.phase = phase;
    this.applyFilters();
  }

  clearSearch(searchInput?: HTMLInputElement) {
    this.currentFilters.q = '';
    if (searchInput) {
      searchInput.value = '';
    }
    this.applyFilters();
  }

  clearFilters(searchInput?: HTMLInputElement) {
    this.currentFilters = { q: '', status: '', phase: '', pageSize: 20 };
    if (searchInput) {
      searchInput.value = '';
    }
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.currentFilters.q || this.currentFilters.status || this.currentFilters.phase);
  }

  private applyFilters() {
    this.pageIndex = 0;
    this.currentFilters.pageNumber = this.pageIndex;
    this.trialsService.searchTrials(this.currentFilters);
  }

  toggleFollow(id: string) {
    this.trialsService.toggleFollow(id);
  }

  isFollowed(nctId: string): boolean {
    const followed = this.trialsService.getCurrentFollowed();
    return followed.has(nctId);
  }

  toggleFollowedView(showOnlyFollowed: boolean) {
    this.showOnlyFollowed = showOnlyFollowed;

    combineLatest([
      this.trials$,
      this.followed$
    ]).pipe(
      takeUntil(this.destroy$),
      map(([trials, followed]) => {
        if (this.showOnlyFollowed) {
          return trials.filter(trial => followed.has(trial.nctId));
        }
        return trials;
      })
    ).subscribe(filteredTrials => {
      this.displayedTrials = filteredTrials;
    });
  }

  getStatusDisplayName(apiStatus: string): string {
    return this.statusDisplayMap[apiStatus] || apiStatus;
  }

  getPhaseDisplayName(apiPhase: string): string {
    return this.phaseDisplayMap[apiPhase] || apiPhase;
  }

  onPageChange(event: any) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.currentFilters.pageSize = this.pageSize;
    this.currentFilters.pageNumber = this.pageIndex;
    this.trialsService.currentPageIndex = this.pageIndex;

    this.applyFilters();
  }

}
