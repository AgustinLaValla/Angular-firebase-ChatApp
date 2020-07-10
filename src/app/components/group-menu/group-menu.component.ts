import { Component, OnInit, OnDestroy } from '@angular/core';
import { GroupService } from 'src/app/services/group.service';
import { AuthService } from 'src/app/services/auth.service';
import { MatDialog, MatSnackBar } from '@angular/material';
//Dialog component
import { AddMemberComponent } from '../add-member/add-member.component';
import { Subscription } from 'rxjs';
import { filter, tap, map, mergeMap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { DialogTypes } from 'src/app/interface/dialog-types.enum';


@Component({
  selector: 'app-group-menu',
  templateUrl: './group-menu.component.html',
  styleUrls: ['./group-menu.component.css']
})
export class GroupMenuComponent implements OnInit, OnDestroy {

  public currentGroup: any;
  public isGroup: boolean = false;
  public isOwner: boolean = false;
  private refreshListener$ = new Subscription()

  constructor(
    public groupService: GroupService,
    private authService: AuthService,
    private dialogRef: MatDialog,
    private snack:MatSnackBar
  ) { }

  ngOnInit() {
    this.getGroup();
    this.refreshListener();
  }

  getGroup() {
    this.groupService.enteredGroup.pipe(
      filter(value => !isNullOrUndefined(value)),
      tap(() => {
        this.currentGroup = this.groupService.currentGroup;
        this.isGroup = true
        this.isOwner = this.currentGroup && this.currentGroup.creator == this.authService.currentUserDetails().email ? true : false
      })
    ).subscribe();
  }

  refreshListener() {
    this.groupService.refreshGroup().pipe(
      filter(groupData => !isNullOrUndefined(groupData)),
      tap(console.log),
      map((groupData) => this.currentGroup = groupData[0])
    ).subscribe();
  }

  addMember() {
    this.dialogRef.open(AddMemberComponent, {
      height: '500px',
      width: '440px',
      data: {dialogType: DialogTypes.addMember}
    })
  }

  groupInfo($event) {
    this.dialogRef.open(AddMemberComponent, {
      height: '550px',
      width: '440px',
      data: {dialogType: DialogTypes.groupInfo}
    })
  }

  removeMember() {
    this.dialogRef.open(AddMemberComponent, {
      height: '550px',
      width: '440px',
      data: {dialogType: DialogTypes.removeMember}
    });
  }

  async onFileInput(file:File) {
    if(file && file.type.indexOf('image') < 0) {
      return this.snack.open('Only image files are allowed', 'OK', {duration:3000});
    };
    if (file) {
      await this.groupService.changeGroupPic(file);
    }
  }

  async deleteGroup() {
    await this.groupService.deleteGroup();
    this.snack.open('Group data has been deleted', 'OK', {duration:3500});
  };

  ngOnDestroy() {
    this.refreshListener$.unsubscribe();
  }

}
