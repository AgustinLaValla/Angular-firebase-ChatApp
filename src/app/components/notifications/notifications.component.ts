import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessagesService } from 'src/app/services/messages.service';
import { filter, map, tap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { IUser } from '../../interface/user.interface';
import { Notification } from '../../interface/notification.interface';  
import { GroupService } from 'src/app/services/group.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {

  public myNotifications: any[] = [];
  public currentChatUser: any;
  public showNotifications: boolean = false;

  private enteredChatSubs$ = new Subscription();
  private notificationSub$ = new Subscription();

  constructor(
    private messagesService: MessagesService,
    private groupService: GroupService,
    private notificationsService: NotificationsService
  ) {
    this.showNotifications = false;
  }

  ngOnInit() {
    this.enteredChatListener();
    this.getNotitications();
  }

  enteredChatListener() {
    this.enteredChatSubs$ =this.messagesService.enteredChat.pipe(
      filter(value => value !== null && value !== undefined),
      tap((value => value
        ? this.notificationsService.clearMessageNotifications(this.messagesService.currentUserChat.email)
        : null)
      ),
      map(() => this.currentChatUser = this.messagesService.currentUserChat),
    ).subscribe();
  };


  getNotitications() {
    this.notificationSub$ = this.notificationsService.getMyNotificactions().pipe(
      filter(notifications => notifications !== null && notifications !== undefined),
      tap(() => this.showNotifications = false),
      map((notifications) => {
        if (!isNullOrUndefined(this.currentChatUser)) {
          notifications.map((notification: Notification, i: number) => {
            if (notification.sender == this.currentChatUser.email && notification.type === 'message') {
              notifications.splice(i, 1);
              this.notificationsService.clearMessageNotifications(this.currentChatUser.email);
            }
          })
        }
        return notifications;
      }),
      map(notifications => this.myNotifications = notifications.reverse()),
      map(() => this.showNotifications = true)
    ).subscribe();
  }

  handleClick(notification: any) {
    if (notification.type === 'message') {
      this.openChat({
        email: notification.sender,
        photoURL: notification.senderPic,
        displayName: notification.senderName
      });
    } else {
      this.openGroup(notification.groupId);
    }
  }

  openChat(friend: Partial<IUser>) {
    this.messagesService.enterChat(friend)
  }

  openGroup(groupId: string) {
    this.groupService.getGroup(groupId)
  };


  ngOnDestroy(): void {
    this.enteredChatSubs$.unsubscribe();
    this.notificationSub$.unsubscribe();
  }
}
