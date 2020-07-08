import { Component, OnInit } from '@angular/core';
import { GroupService } from 'src/app/services/group.service';
import { MatSnackBar } from '@angular/material';
import { MessagesService } from 'src/app/services/messages.service';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'app-my-groups',
  templateUrl: './my-groups.component.html',
  styleUrls: ['./my-groups.component.css']
})
export class MyGroupsComponent implements OnInit {

  public showAdd: boolean = false;
  public groupName: string;
  public myGroups: any[] = [];


  constructor(private groupsService: GroupService, private snack: MatSnackBar, private messagesService: MessagesService) { }

  async ngOnInit() {
    await this.getGroup();
  }

  async getGroup() {
    const groupsObs$: Observable<any> = await this.groupsService.getGroup();
    groupsObs$.pipe(
      filter(groups => !isNullOrUndefined(groups)),
      map(groups => this.myGroups = groups)
    ).subscribe(console.log);
  };

  async createGroup() {
    await this.groupsService.createGroup(this.groupName);
    this.snack.open('Group Created', 'Dismiss', {
      duration: 3000
    });
  };

  addGroup() {
    this.showAdd = !this.showAdd;
  }

  refreshList() { }

  openGroup(group) {
    this.groupsService.enterGroup(group);
    this.messagesService.enterChat('closed'); //In case the user are chatting to an other user the chats is closed
  }

}
