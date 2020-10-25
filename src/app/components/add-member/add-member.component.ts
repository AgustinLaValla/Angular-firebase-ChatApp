import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FriendsService } from 'src/app/services/friends.service';
import { GroupService } from 'src/app/services/group.service';
import { switchMap, filter, tap, map, mergeMap } from 'rxjs/operators';
import { IUser } from 'src/app/interface/user.interface';
import { MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { DialogTypes } from 'src/app/interface/dialog-types.enum';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-member',
  templateUrl: './add-member.component.html',
  styleUrls: ['./add-member.component.css']
})
export class AddMemberComponent implements OnInit, OnDestroy {

  public myFriends: IUser[] = [];
  public loadingSpinner: boolean = false;
  public isMember: boolean[] = [];

  public members: IUser[] = [];

  public currentGroup = this.groupService.currentGroup;

  private friendsSubs$ = new Subscription();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { dialogType: DialogTypes },
    private friendsService: FriendsService,
    private groupService: GroupService,
    private snack: MatSnackBar
  ) { }

  ngOnInit() {
    this.getFriends();
  }

  getFriends() {
    this.loadingSpinner = true;
    this.friendsSubs$ = this.friendsService.getMyFriends().pipe(
      switchMap(async (emails) => await this.friendsService.getFriendsProfiles(emails)),
      tap((friendsProfiles) => {
        this.loadingSpinner = false;
        this.myFriends = friendsProfiles;
      }),
      mergeMap(() => {
        return this.groupService.getMembers().pipe(
          filter(members => members !== null && members !== undefined),
          tap((members) => this.members = members),
          map((members) => this.getMembers(members))
        )
      })
    ).subscribe();
  }

  async addFriend(user) {
    await this.groupService.addMember(user);
  }


  async removeFriend(user: IUser) {
    await this.groupService.removeMembers(user);
    this.snack.open('Member removed', 'Okay', { duration: 4000 });
  }

  getMembers(members: IUser[]) {
    let flag = 0;
    this.myFriends.forEach(friend => {
      members.forEach(member => friend.email === member.email ? flag = 1 : null)
      flag === 1 ? this.isMember.push(true) : this.isMember.push(false);
      flag = 0;
    })
  }


  ngOnDestroy(): void {
    this.friendsSubs$.unsubscribe();
  }

}

