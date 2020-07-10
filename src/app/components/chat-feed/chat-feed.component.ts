import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Input } from '@angular/core';
import { MessagesService } from 'src/app/services/messages.service';
import { AuthService } from 'src/app/services/auth.service';
import { MatDialog } from '@angular/material';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { map, filter, tap, mergeMap } from 'rxjs/operators';
import { IUser } from 'src/app/interface/user.interface';
import { isNullOrUndefined } from 'util';
import { GroupService } from 'src/app/services/group.service';
import { ChatTypes } from 'src/app/interface/chat-types.enum';
import * as moment from 'moment/moment';

@Component({
  selector: 'app-chat-feed',
  templateUrl: './chat-feed.component.html',
  styleUrls: ['./chat-feed.component.css']
})
export class ChatFeedComponent implements OnInit, OnDestroy {

  constructor(
    private messageService: MessagesService,
    private authService: AuthService,
    private dialogRef: MatDialog,
    private groupService: GroupService
  ) { }

  @Input() public chatType: ChatTypes;
  public showChat: boolean = false;
  public showGroupChat: boolean = false;
  public messages: any[] = [];
  public loadingSpinner: boolean = false;
  public MyId: string;
  public MyAvatar: any;
  public currentChatUser: IUser;
  public checkFirst: number = 1;
  @ViewChild('scrollMe', { static: false }) public myScroller: ElementRef;
  //Infinite scroll helpers
  public count: number = 10;
  public shouldLoad: boolean = true;
  public allLoaded: boolean = false;
  public trackMsgCount: number;
  //Picture messages helpers
  public isPicMsg: boolean;
  public pictureMessage: string;
  public pictureSpinner: boolean = false;
  //Listeners
  private chatListener$ = new Subscription();
  private groupChatListener$ = new Subscription();
  private messagesListener$ = new Subscription();
  private groupMessagesListener$ = new Subscription();
  private pictureSpinnerSubs = new Subscription();
  private newMsgListener$ = new Subscription();
  private firstChatMessageListener = new Subscription();
  private loadingMessagesListener$ = new Subscription();

  ngOnInit() {
    this.chatListener();
    this.groupChatListener();
    this.groupMsgFlagListener();
    this.loadingMessagesListener();
    this.MyAvatar = this.authService.currentUserDetails().photoURL;
    this.pictureSpinnerSubs = this.messageService.pictureSpinner$.subscribe(value => this.pictureSpinner = value);
    this.firstChatMessageListener = this.messageService.firstchatMessage$.pipe(
      filter(value => value),
      mergeMap(async () => await this.getMessages())
    ).subscribe();
  };

  chatListener() {
    this.chatListener$ = this.messageService.enteredChat.pipe(
      
      map((show) => this.showChat = show),
      filter(show => show),
      tap(() => {
        this.count = 10;
        this.messages = [];
      }),
      mergeMap(async () => await this.getMessages()),
      map(() => this.currentChatUser = this.messageService.currentUserChat)
    ).subscribe();
  };

  groupChatListener() {
    this.groupChatListener$ = this.groupService.enteredGroup.pipe(

      map((show) => this.showGroupChat = show),
      filter((show) => show),
      tap(() => {
        this.count = 10;
        this.messages = [];
        this.currentChatUser = null;
      }),
      mergeMap(async () => await this.getGroupMessages()),

    ).subscribe()
  }

  async getMessages() {
    this.loadingSpinner = true;
    this.messageService.loadingMessages.next(true);
    const messageObs = await this.messageService.getAllMessages(this.count);
    this.messagesListener$ = this.newMsgListener$ = messageObs.pipe(
      tap(console.log),
      filter(messages => !isNullOrUndefined(messages)),
      map(messages => {
        this.loadingSpinner = false;
        this.trackMsgCount = 0;
        this.shouldLoad = true;
        this.allLoaded = false;
        this.messages = messages.reverse();
        this.messageService.loadingMessages.next(false);
      })
    ).subscribe();


  }

  async getGroupMessages() {
    this.loadingSpinner = true;
    this.messageService.loadingMessages.next(true);
    const groupMessages$ = await this.messageService.getGroupMessages(this.count);
    groupMessages$.pipe(
      tap((messages) => {

        this.loadingSpinner = false;
        this.trackMsgCount = 0;
        this.shouldLoad = true;
        this.allLoaded = false;
        this.messages = [...messages].reverse();
        this.messageService.loadingMessages.next(false);
      })
    ).subscribe()

  }

  groupMsgFlagListener() {
    this.messageService.groupMsgFlag.pipe(
      tap((value) => {
        if (value === 'Nothing') {
          this.loadingSpinner = false;
          this.messages = [];
          this.count = 10;
          this.trackMsgCount = 0;
          this.shouldLoad = true;
          this.allLoaded = false;
        }
      })
    ).subscribe();
  }

  loadingMessagesListener() {
    this.loadingMessagesListener$ = this.messageService.loadingMessages.pipe(
      filter(loading => !isNullOrUndefined(loading)),
      tap((loading) => loading ? this.openDialog() : this.scrollDown())
    ).subscribe();
  }


  openDialog() {
    this.dialogRef.open(LoadingSpinnerComponent, {
      height: '150px',
      width: '150px'
    })
  }

  closeDialog() {
    this.dialogRef.closeAll();
  }

  
  scrollDown() {
    if (this.myScroller) {
      setTimeout(() => {
        this.myScroller.nativeElement.scrollTop = this.myScroller.nativeElement.scrollHeight;
        this.closeDialog();
      }, 1000);
    }
  }

  chooseClass(msg: any) {
    this.MyId = this.authService.currentUserDetails().email;
    if (msg.sentby != this.MyId && msg.message.includes('picMsg')) {
      this.isPicMsg = true;
      this.pictureMessage = msg.message.substring(6)
      return 'bubble client attachment';
    } else if (msg.sentby == this.MyId && msg.message.includes('picMsg')) {
      this.isPicMsg = true;
      this.pictureMessage = msg.message.substring(6)
      return 'bubble attachment';
    } else if (msg.sentby != this.MyId && !msg.message.includes('picMsg')) {
      this.isPicMsg = false;
      return 'bubble client'
    } else if (msg.sentby == this.MyId && !msg.message.includes('picMsg')) {
      this.isPicMsg = false;
      return 'bubble'
    }
  }

  //Infinite scrolling
  async scrollHandler(event) {
    if (event === 'top') {
      if (this.chatType === ChatTypes.PERSONAL_CHAT) {
        console.log(this.chatType)
        if (this.shouldLoad) {
          this.count += 10;
          this.loadingSpinner = true;

          const gotMessages = await this.messageService.getAllMessages(this.count)
          gotMessages.pipe(
            filter(messages => !isNullOrUndefined(messages)),
            map((messages) => this.messages = [...messages].reverse()),
            tap(() => this.loadingSpinner = false),
            tap(() => this.messages.length == this.trackMsgCount ? this.shouldLoad = false : this.trackMsgCount = this.messages.length)
          ).subscribe();
        } else {
          this.allLoaded = true;
        }
      } else if (this.chatType === ChatTypes.GROUP_CHAT) {
        console.log(this.chatType)
        if (this.shouldLoad) {
          this.count += 10;
          this.loadingSpinner = true;

          const gotGroupMessages = await this.messageService.getGroupMessages(this.count);
          gotGroupMessages.pipe(
            filter(messages => !isNullOrUndefined(messages)),
            map(messages => this.messages = [...messages].reverse()),
            tap(() => this.loadingSpinner = false),
            tap(() => this.messages.length == this.trackMsgCount ? this.shouldLoad = false : this.trackMsgCount = this.messages.length)
          )
            .subscribe();
        }
      }

    }
  }

  getDateFromNow(timeStamp:number): string {
    const date = moment.unix(timeStamp);
    return moment(date).fromNow();
  }

  ngOnDestroy() {
    this.pictureSpinnerSubs.unsubscribe()
    this.newMsgListener$.unsubscribe();
    this.firstChatMessageListener.unsubscribe();
    this.loadingMessagesListener$.unsubscribe();
    this.chatListener$.unsubscribe();
    this.groupChatListener$.unsubscribe();
    this.messagesListener$.unsubscribe();
    this.groupMessagesListener$.unsubscribe();
  }

}
