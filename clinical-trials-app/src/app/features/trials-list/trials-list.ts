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

  displayedTrials: TrialSummary[] = [];
  displayedColumns = ['nctId', 'title', 'phase', 'status', 'condition', 'follow'];

  showOnlyFollowed = false;
  currentFilters: Filters = { q: '', status: '', phase: '', pageSize: 20 };

  private destroy$ = new Subject<void>();

  constructor(private trialsService: TrialsService) {
    this.trials$ = this.trialsService.trials$;
    this.followed$ = this.trialsService.followed$;
    this.loading$ = this.trialsService.loading$;
  }

  ngOnInit() {
    this.trialsService.searchTrials({ q: 'cancer' });

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
}
