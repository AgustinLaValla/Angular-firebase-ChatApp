import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { tap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private authService: AuthService, private router: Router) {
    this.initHandler();
  }

  initHandler() {
    this.authService.initListener().pipe(
      tap((user) => !isNullOrUndefined(user) ? this.router.navigate(['']) : this.router.navigate(['/login']))
    ).subscribe();
  }

}
