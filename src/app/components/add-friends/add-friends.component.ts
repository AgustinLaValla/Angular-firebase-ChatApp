import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { RequestService } from 'src/app/services/request.service';
import { FriendsService } from 'src/app/services/friends.service';
import { Subject, Subscription } from 'rxjs';
import { filter, map, tap, switchMap, mergeMap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { Friend } from 'src/app/interface/friend.interface';
import { Request } from 'src/app/interface/request.interface';
import { IUser } from 'src/app/interface/user.interface';


@Component({
  selector: 'app-add-friends',
  templateUrl: './add-friends.component.html',
  styleUrls: ['./add-friends.component.css']
})
export class AddFriendsComponent implements OnInit, OnDestroy {

  public users: IUser[] = [];
  public userBackUp: IUser[] = [];
  public isFriends: boolean[] = [];
  public isRequested: boolean[] = [];
  public isSent: boolean[] = [];
  public startAt = new Subject();
  public endAt = new Subject();
  public myFriends: Friend[] = [];
  public myRequest: Request[] = [];
  public mySentRequest: Request[] = [];
  public usersLimit: number;
  public totalUsers: number = 0;

  private usersSubs$ = new Subscription();
  private totalUsersSub$ = new Subscription();

  constructor(
    private userService: UserService,
    private requestService: RequestService,
    private friendsService: FriendsService
  ) {
    this.usersLimit = 11;
  }

  ngOnInit() {
    this.showMembers();
    this.setTotalUsersListener();
  }

  getUsers() {
    return this.userService.getAllUsers(this.usersLimit).pipe(
      filter(users => users !== null && users !== undefined),
      map(users => {
        this.userBackUp = users;
        this.users = users;
      })
    )
  }

  showMembers() {
    this.usersSubs$ = this.getUsers().pipe(
      switchMap(() => this.friendsService.getMyFriends().pipe(
        filter((friends) => friends !== null && friends !== undefined),
        map((friends) => this.myFriends = friends),
        tap((friends) => friends.length > 0 ? this.areFriends(friends) : null),
      )),
      mergeMap(() => this.requestService.getMyRequest().pipe(
        tap((requests) => {
          this.myRequest = requests;
          this.userRequestedMe();
        })
      )),
      mergeMap(() => this.requestService.getSentRequests().pipe(
        tap((requests) => {
          this.mySentRequest = requests;
          this.didIRequestedUser();
        })
      )),

    ).subscribe();
  }

  setTotalUsersListener() {
    this.totalUsersSub$ = this.userService.getTotalUsers().pipe(
      tap(console.log),
      map(total => this.totalUsers = total)
    ).subscribe();
  }

  areFriends(friends: Friend[]) {
    let flag = 0;
    this.userBackUp.map((userElement, i) => {
      friends.forEach(friendElement => userElement.email === friendElement.email ? flag = 1 : null);
      flag === 1 ? this.isFriends[i] = true : this.isFriends[i] = false;
      flag = 0;
    });

  };

  userRequestedMe() {
    let flag = 0;
    this.userBackUp.forEach((userElement, i) => {
      this.myRequest.forEach((reqElement) => userElement.email == reqElement['sender'] ? flag = 1 : null);
      flag === 1 ? this.isRequested[i] = true : this.isRequested[i] = false;
      flag = 0;
    });
  };

  didIRequestedUser() {
    let flag = 0;
    this.userBackUp.forEach((userElement, i) => {
      this.mySentRequest.forEach((reqElement) => userElement.email == reqElement['receiver'] ? flag = 1 : null);
      flag === 1 ? this.isSent[i] = true : this.isSent[i] = false
      flag = 0;
    });
  };


  async addFriend(user: IUser) {
    await this.requestService.addRequest(user.email);
  };

  canShow(index: number) {
    if (this.isFriends[index]) {
      return false;
    } else if (this.isRequested[index]) {
      return false;
    } else if (this.isSent[index]) {
      return false;
    } else {
      return true;
    };
  };


  instantSearch($event) {
    let query = $event.target.value;
    if (query !== '') {

      this.userService.instantSearch(query, query + '\uf8ff').pipe(
        filter(users => !isNullOrUndefined(users)),
        tap((users) => this.instantSearchFilter(users)),
        map(users => this.users = users)
      ).subscribe();
    } else {
      this.instantSearchFilter(this.userBackUp);
      this.users = this.userBackUp;
    };
  };

  instantSearchFilter(users: any[]) {
    if (this.myFriends) {
      this.isFriends = [];
      this.isRequested = [];
      this.isSent = [];

      users.map(() => {
        this.areFriends(this.myFriends);
        this.userRequestedMe();
        this.didIRequestedUser();
      })
    } else {
      users.map((element, i) => {
        this.isFriends[i] = false;
      })
    };
  };

  loadMore() {
    if (this.usersLimit < this.totalUsers) {
      this.usersLimit += 10;
      this.totalUsersSub$ = this.getUsers().pipe(
        tap({
          next: () => {
            this.areFriends(this.myFriends),
            this.userRequestedMe(),
            this.didIRequestedUser()
          }
        })
      ).subscribe();
    }
  }

  ngOnDestroy() {
    this.usersSubs$.unsubscribe();
    this.totalUsersSub$.unsubscribe();
  }

}
