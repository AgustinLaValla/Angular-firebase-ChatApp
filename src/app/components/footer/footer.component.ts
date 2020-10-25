import { Component, OnInit } from '@angular/core';
import { MessagesService } from 'src/app/services/messages.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  public newMessage: string;
  public picMessage: File;


  constructor(
    private messagesService: MessagesService,
    private snack: MatSnackBar
  ) { }

  ngOnInit() {
  }

  async addMessage() {
    if (this.newMessage) {
      await this.messagesService.addNewMsg(this.newMessage);
      this.newMessage = '';
    };
  };
  async sendImage(image: File) {
    this.picMessage = image;
    if (this.picMessage && this.picMessage.type.indexOf('image') >= 0) {
      this.messagesService.pictureSpinner$.next(true);
      await this.messagesService.addPictureImage(this.picMessage);
    } else {
      this.snack.open('Only image files are allowed', 'OK', { duration: 3000 });
    };
  };

  submit($event) {
    if ($event.keyCode === 13) {
      this.addMessage();
    };
  };
}
