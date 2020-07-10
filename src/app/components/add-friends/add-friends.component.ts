import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { RequestService } from 'src/app/services/request.service';
import { FriendsService } from 'src/app/services/friends.service';
import { Subscription, Subject, combineLatest } from 'rxjs';
import { take, filter, map, tap, switchMap, mergeMap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { Friend } from 'src/app/interface/friend.interface';
import { Request } from 'src/app/interface/request.interface';
import { IUser } from 'src/app/interface/user.interface';


@Component({
  selector: 'app-add-friends',
  templateUrl: './add-friends.component.html',
  styleUrls: ['./add-friends.component.css']
})
export class AddFriendsComponent implements OnInit {

  public users: IUser[] = [];
  public userBackUp: IUser[] = [];
  public isFriends: boolean[] = [];
  public isRequested: boolean[] = [];
  public isSent: boolean[] = [];
  public friendsCollSubscription: Subscription;
  public startAt = new Subject();
  public endAt = new Subject()

  public myFriends: Friend[] = [];
  public myRequest: Request[] = [];
  public mySentRequest: Request[] = [];

  constructor(private userService: UserService,
    private requestService: RequestService,
    private friendsService: FriendsService) { }

  ngOnInit() {
    this.showMembers();
    this.showMembersResquests();
  }

  showMembers() {
    this.userService.getAllUsers().pipe(
      filter(users => !isNullOrUndefined(users)),
      map(users => {
        this.userBackUp = users;
        this.users = users;
      }),
      tap(async () => {
        await this.friendsService.getMyFriends();
      }),
      switchMap(() => this.friendsService.friendProfileTrigger$.pipe(
        filter((user) => user === 'Exists'),
        mergeMap(() => this.friendsService.getFriendList().pipe(
          map((friends) => this.myFriends = friends),
          tap((friends) => friends.length > 0 ? this.areFriends(friends) : null)
        ))
      )),
      mergeMap(() => this.requestService.getMyRequest().pipe(
        tap((requests) => {
          this.userRequestedMe(requests);
        })
      )),
      mergeMap(() => this.requestService.getSentRequests().pipe(
        tap((requests) => {
          this.didIRequestedUser(requests);
        })
      )),

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

  userRequestedMe(requests: Request[]) {
    let flag = 0;
    this.myRequest = requests;
    this.userBackUp.forEach((userElement, i) => {
      requests.forEach((reqElement) => userElement.email == reqElement['sender'] ? flag = 1 : null);
      flag === 1 ? this.isRequested[i] = true : this.isRequested[i] = false;
      flag = 0;
    });
  };

  didIRequestedUser(requests: Request[]) {
    this.mySentRequest = requests;
    let flag = 0;
    this.userBackUp.forEach((userElement, i) => {
      requests.forEach((reqElement) => userElement.email == reqElement['receiver'] ? flag = 1 : null);
      flag === 1 ? this.isSent[i] = true : this.isSent[i] = false
      flag = 0;
    });
  };

  showMembersResquests() {
    this.friendsService.friendProfileTrigger$.pipe(
      filter((user) => user === 'Nothing'),
      switchMap(() => this.requestService.getMyRequest().pipe(
        tap((requests) => {
          this.userRequestedMe(requests);
        })
      )),
      mergeMap(() => this.requestService.getSentRequests().pipe(
        tap((requests) => {
          this.didIRequestedUser(requests);
        })
      )),
    ).subscribe();

  }

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
        this.userRequestedMe(this.myRequest);
        this.didIRequestedUser(this.mySentRequest);
      })
    } else {
      users.map((element, i) => {
        this.isFriends[i] = false;
      })
    };
  };

}
