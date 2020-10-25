import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { FriendsService } from 'src/app/services/friends.service';
import { Subscription } from 'rxjs';
import { MessagesService } from 'src/app/services/messages.service';
import { map, filter, mergeMap } from 'rxjs/operators';
import { Friend } from 'src/app/interface/friend.interface';
import { IUser } from 'src/app/interface/user.interface';
import { Status } from 'src/app/interface/status.interface';
import { GroupService } from 'src/app/services/group.service';

@Component({
  selector: 'app-my-friends',
  templateUrl: './my-friends.component.html',
  styleUrls: ['./my-friends.component.css']
})
export class MyFriendsComponent implements OnInit, OnDestroy {

  constructor(
    private userService: UserService,
    private friendsService: FriendsService,
    private messageService: MessagesService,
    private groupService: GroupService
  ) { }

  public friends: IUser[] = [];
  public statusses: Status[] = [];

  private statusListener$ = new Subscription();
  private friendList$ = new Subscription();

  async ngOnInit() {
    await this.getMyFriends();
    this.statusListener();
  };

  async getMyFriends() {
    this.friendList$ = this.friendsService.getMyFriends().pipe(
      filter(friends => friends !== null && friends !== undefined),
      mergeMap(async (emails: Friend[]) => await this.friendsService.getFriendsProfiles(emails)),
      map((friendsDetails) => this.friends = friendsDetails),
      mergeMap(() => this.userService.updateUserStatuses())
    ).subscribe();
  };

  statusListener() {
    this.statusListener$ = this.userService.statusUpdate.pipe(
      filter(value => value === 'StatusUpdated'),
      mergeMap(async () => await this.userService.getUsersStatus(this.friends)),
      map((statusses) => this.statusses = statusses)
    ).subscribe();
  };

  //Chat whit a particular user
  enterChat(friend: IUser) {
    this.messageService.enterChat(friend);
    this.groupService.enterGroup('closed');
  };

  ngOnDestroy(): void {
    this.statusListener$.unsubscribe();
    this.friendList$.unsubscribe();
  };

}
