import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TrialsService } from '../../core/trials.service';
import { TrialDetail } from '../../core/models';
import { Observable } from 'rxjs';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatusIndicator } from '../../shared/components/status-indicator/status-indicator';

@Component({
  selector: 'app-trial-detail',
  templateUrl: './trial-detail.html',
  styleUrls: ['./trial-detail.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    StatusIndicator
  ]
})
export class TrialDetailComponent implements OnInit {
  trialId: string = '';
  loading$: Observable<boolean>;

  trialDetail: TrialDetail | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trialsService: TrialsService
  ) {
    this.loading$ = this.trialsService.loading$;
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.trialId = params['nctId'];
      if (this.trialId) {
        this.loadTrialDetail();
      }
    });
  }

  private loadTrialDetail() {

    this.trialsService.trials$.subscribe(trials => {
      const trial = trials.find(t => t.nctId === this.trialId);
      if (trial) {
        this.trialDetail = {
          nctId: trial.nctId,
          title: trial.title,
          status: trial.status,
          phase: trial.phase,
          condition: trial.condition,
          description: 'Detailed description will be loaded from the API...',
          eligibility: 'Eligibility criteria will be loaded from the API...',
          locations: [],
          sponsor: 'Sponsor information will be loaded from the API...'
        };
      }
    });

    this.trialsService.getTrial(this.trialId);
  }

  goBack() {
    this.router.navigate(['/trials']);
  }

  toggleFollow() {
    this.trialsService.toggleFollow(this.trialId);
  }

  isFollowed(): boolean {
    return this.trialsService.getCurrentFollowed().has(this.trialId);
  }
}
