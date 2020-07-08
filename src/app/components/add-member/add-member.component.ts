import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FriendsService } from 'src/app/services/friends.service';
import { Observable, Subscription } from 'rxjs';
import { GroupService } from 'src/app/services/group.service';
import { switchMap, filter, tap, map, mergeMap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { AuthService } from 'src/app/services/auth.service';
import * as firebase from 'firebase';
import { IUser } from 'src/app/interface/user.interface';
import { MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { DialogTypes } from 'src/app/interface/dialog-types.enum';

@Component({
  selector: 'app-add-member',
  templateUrl: './add-member.component.html',
  styleUrls: ['./add-member.component.css']
})
export class AddMemberComponent implements OnInit, OnDestroy {

  public myFriends: any[] = [];
  public loadingSpinner: boolean = false;
  public isMember: any[] = [];

  public members: IUser[] = [];

  private currentUserListener$ = new Subscription();
  private currentUser: firebase.User;

  public currentGroup = this.groupService.currentGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { dialogType: DialogTypes },
    private friendsService: FriendsService,
    private groupService: GroupService,
    private authService: AuthService,
    private snack: MatSnackBar
  ) { }

  ngOnInit() {
    console.log(this.data)
    this.currentUserListener();
    this.getFriends();
  }

  async getFriends() {
    this.loadingSpinner = true;
    await this.friendsService.getMyFriends();
    this.friendsService.friendProfileTrigger$.pipe(
      filter(value => value === 'Exists'),
      switchMap(() => this.friendsService.getFriendList().pipe(
        switchMap(async (emails) => await this.friendsService.getFriendsProfiles(emails)),
        tap((friendsProfiles) => {
          this.loadingSpinner = false;
          this.myFriends = friendsProfiles;
        }),
        mergeMap(async () => await this.updateList())
      ))
    ).subscribe();
  }

  async addFriend(user) {
    await this.groupService.addMember(user);
  }

  updateList() {
    let flag = 0;
    this.groupService.getMembers().pipe(
      filter(members => !isNullOrUndefined(members)),
      tap(() => this.isMember = []),
      tap((members) => this.members = members),
      map((members) => {
        this.myFriends.forEach(friend => {
          members.forEach(member => friend.email === member.email ? flag = 1 : null)
          flag === 1 ? this.isMember.push(true) : this.isMember.push(false);
          flag = 0;
        })
      })
    ).subscribe();

  };

  currentUserListener() {
    this.currentUserListener$ = this.authService.currentUser.pipe(
      filter(user => !isNullOrUndefined(user)),
      map(user => this.currentUser = user)
    ).subscribe();
  }


  async removeFriend(user: IUser) {
    await this.groupService.removeMembers(user);
    this.snack.open('Member removed', 'Okay', { duration: 4000 });
  }

  ngOnDestroy(): void {
    this.currentUserListener$.unsubscribe();
  }

}

