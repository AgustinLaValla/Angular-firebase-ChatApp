import { Component, OnInit } from '@angular/core';
import { RequestService } from 'src/app/services/request.service';
import { MatSnackBar } from '@angular/material';
import { UserService } from 'src/app/services/user.service';
import { filter, map, switchMap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';


@Component({
  selector: 'app-request',
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.css']
})
export class RequestComponent implements OnInit {

  public requests: any;

  constructor(
    private requestService: RequestService,
    private snack: MatSnackBar,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.getRequests();
  };

  getRequests() {
    this.requestService.getMyRequest().pipe(
      filter(request => !isNullOrUndefined(request)),
      switchMap(request => this.userService.getUsers(request).pipe(
        filter(users => !isNullOrUndefined(users)),
        map(users => this.requests = users)
      ))
    ).subscribe();
  };

  async acceptRequest(request) {
    await this.requestService.acceptRequest(request);
    this.snack.open('Friend added', 'Okey', { duration: 4000 });
  };

  async deleteRequest(request) {
    await this.requestService.deleteRequest(request);
    this.snack.open('Request Ignored', 'Okay', { duration: 3000 });
  };
};

