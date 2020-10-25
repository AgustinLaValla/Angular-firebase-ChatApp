import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessagesService } from 'src/app/services/messages.service';
import { filter, map } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { Subscription } from 'rxjs';
import { IUser } from 'src/app/interface/user.interface';

@Component({
  selector: 'app-friend-info',
  templateUrl: './friend-info.component.html',
  styleUrls: ['./friend-info.component.css']
})
export class FriendInfoComponent implements OnInit, OnDestroy {

  public currentUser: Partial<IUser>;
  public isUserSelected: boolean = false;

  private enteredChatListener$ = new Subscription();

  constructor(private messagesService: MessagesService) {
    this.enteredChatListener$ = this.messagesService.enteredChat.pipe(
      map((value) => this.isUserSelected = value),
      filter(value => value),
      map(() => this.currentUser = this.messagesService.currentUserChat),
    ).subscribe();
  }

  ngOnInit() { }


  closeCall() {
    this.messagesService.enterChat('closed');
  };

  ngOnDestroy() {
    this.enteredChatListener$.unsubscribe();
  };

}
