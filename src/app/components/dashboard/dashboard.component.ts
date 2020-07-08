import { Component, OnInit } from '@angular/core';
import { GroupService } from 'src/app/services/group.service';
import { MessagesService } from 'src/app/services/messages.service';
import { filter, tap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { ChatTypes } from 'src/app/interface/chat-types.enum';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  public chatFeed: boolean = false;
  public chatGroupFeed: boolean = false;
  public chatType: ChatTypes;

  constructor(private groupService: GroupService, private messageService: MessagesService) { }

  ngOnInit() {
    this.friendChatListener();
    this.groupChatListener();
  };

  friendChatListener() {
    this.messageService.enteredChat.pipe(
      filter(show => !isNullOrUndefined(show)),
      tap((show) => show ? this.chatType = ChatTypes.PERSONAL_CHAT : null),
      tap((show) => this.chatFeed = show)
    ).subscribe();
  };

  groupChatListener() {
    this.groupService.enteredGroup.pipe(
      filter(show => !isNullOrUndefined(show)),
      tap((show) => show ? this.chatType = ChatTypes.GROUP_CHAT : null),
      tap((show) => this.chatGroupFeed = show)
    ).subscribe();
  };

}
