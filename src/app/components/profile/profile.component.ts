import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { filter, map, tap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { Subscription } from 'rxjs';
import { UiService } from 'src/app/services/ui.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {

  public user;
  public nickNameEdit: boolean = false;;
  public newNickName: string;
  public selectedFile: FileList;
  private currentUserSub$ = new Subscription();

  constructor(
    private userService: UserService, 
    private authService: AuthService,
    private uiService: UiService
  ) {
    this.currentUserListener();
  }

  ngOnInit() { }

  currentUserListener() {
    this.currentUserSub$ = this.authService.currentUser.pipe(
      tap(() => this.uiService.progressBar = true),
      filter(user => !isNullOrUndefined(user)),
      map(user => this.user = user),
      tap(() => this.uiService.progressBar = false)
    ).subscribe();
  };

  editName() {
    this.nickNameEdit = !this.nickNameEdit;
  }

  async updateName() {
    try {
      await this.userService.updateName(this.newNickName);
      this.uiService.progressBar = false;
      this.editName();

    } catch (error) {
      this.uiService.progressBar = false;
    };
  };

  chooseImage(event) {
    this.selectedFile = event.target.files;
    if (this.selectedFile.item(0)) {
      this.userService.updateProfilePic(this.selectedFile.item(0));
    };
  };


  ngOnDestroy() {
    this.currentUserSub$.unsubscribe();
  }

}
