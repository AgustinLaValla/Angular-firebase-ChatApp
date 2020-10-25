import { Component, OnDestroy, OnInit } from '@angular/core';
import { GroupService } from 'src/app/services/group.service';
import { MessagesService } from 'src/app/services/messages.service';
import { filter, tap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { ChatTypes } from 'src/app/interface/chat-types.enum';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  public chatFeed: boolean = false;
  public chatGroupFeed: boolean = false;
  public chatType: ChatTypes;
  private enteredChatSub$ = new Subscription();
  private enteredGroup$ = new Subscription();

  constructor(
    private groupService: GroupService,
    private messageService: MessagesService
  ) { }

  ngOnInit() {
    this.friendChatListener();
    this.groupChatListener();
  };

  friendChatListener() {
    this.enteredChatSub$ = this.messageService.enteredChat.pipe(
      filter(show => !isNullOrUndefined(show)),
      tap((show) => show ? this.chatType = ChatTypes.PERSONAL_CHAT : null),
      tap((show) => this.chatFeed = show)
    ).subscribe();
  };

  groupChatListener() {
    this.enteredGroup$ = this.groupService.enteredGroup.pipe(
      filter(show => !isNullOrUndefined(show)),
      tap((show) => show ? this.chatType = ChatTypes.GROUP_CHAT : null),
      tap((show) => this.chatGroupFeed = show)
    ).subscribe();
  };

  ngOnDestroy(): void {
    this.enteredChatSub$.unsubscribe();
    this.enteredGroup$.unsubscribe();
  }
}
