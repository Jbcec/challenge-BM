import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TrialsService } from '../../core/trials.service';
import { TrialDetail as ITrialDetail } from '../../core/models';
import { Observable } from 'rxjs';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
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
    NgFor,
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
  trialDetail$: Observable<ITrialDetail | null>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trialsService: TrialsService
  ) {
    this.loading$ = this.trialsService.loading$;
    this.trialDetail$ = this.trialsService.trialDetail$;
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.trialId = params['nctId'];
      if (this.trialId) {
        this.trialsService.getTrial(this.trialId);
      }
    });
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

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';

    const parts = dateString.split('-');

    if (parts.length === 2) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const year = parts[0];
      const month = months[parseInt(parts[1]) - 1];
      return `${month} ${year}`;
    } else if (parts.length === 3) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    return dateString;
  }
}
