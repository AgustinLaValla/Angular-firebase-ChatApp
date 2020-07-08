import { Component, OnInit } from '@angular/core';
import { MessagesService } from 'src/app/services/messages.service';
import { analytics } from 'firebase';
import { filter, map, tap, mergeMap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { Notification } from 'src/app/interface/notification.interface';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {

  public myNotifications: any[] = [];
  public currentChatUser: any;
  public showNotifications: boolean = false;

  constructor(private messagesService: MessagesService) {
    this.showNotifications = false;
  }

  ngOnInit() {
    this.enteredChatListener();
    this.getNotitications();
  }

  enteredChatListener() {
    this.messagesService.enteredChat.pipe(
      filter(value => !isNullOrUndefined(value) && value),
      map(() => this.currentChatUser = this.messagesService.currentUserChat),
      mergeMap( async () => await this.messagesService.clearNotifications())
    ).subscribe();
  };

  getNotitications() {
    this.messagesService.getMyNotificactions().pipe(
      filter(notifications => !isNullOrUndefined(notifications)),
      tap(() => this.showNotifications = false),
      map((notifications) => {
        if(!isNullOrUndefined(this.currentChatUser)) {
          notifications.map( async (notification: Notification, i: number) => {
            if (notification.sender == this.currentChatUser.email) {
              notifications.splice(i, 1);
              await this.messagesService.clearNotifications();
            }
          })
        }
        return notifications;
      }),
      map(notifications => this.myNotifications = notifications),
      map(() => this.showNotifications = true) 
    ).subscribe();
  }

}
