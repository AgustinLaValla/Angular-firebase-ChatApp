import { Component, OnInit } from '@angular/core';
import { MessagesService } from 'src/app/services/messages.service';

@Component({
  selector: 'app-group-footer',
  templateUrl: './group-footer.component.html',
  styleUrls: ['./group-footer.component.css']
})
export class GroupFooterComponent implements OnInit {


  public newMessage: string;
  public picMessage: FileList;


  constructor(private messagesService: MessagesService) { }

  ngOnInit() {
  }

  async addMessage() {
    if(this.newMessage.length > 0) { 
      await this.messagesService.addGroupNewMsg(this.newMessage);
      this.newMessage = ''
    }
   }
   sendImage(event) {   
     this.picMessage = event.target.files;
     if(this.picMessage.item(0)) { 
       this.messagesService.pictureSpinner$.next(true);
       this.messagesService.addGroupPictureImage(this.picMessage.item(0))
     }
   }

   submit($event) {
    if($event.keyCode === 13) { 
      this.addMessage();
    }
  }
}
