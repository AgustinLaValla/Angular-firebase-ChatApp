import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { filter, map, tap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  public user;
  public nickNameEdit: boolean = false;;
  public newNickName: string;
  public selectedFile: FileList;
  public spinnerToggle: boolean = false;

  constructor(private userService: UserService, private authService: AuthService) {
    this.currentUserListener();
  }

  ngOnInit() { }

  currentUserListener() {
    this.authService.currentUser.pipe(
      tap(() => this.spinnerToggle = true),
      filter(user => !isNullOrUndefined(user)),
      map(user => this.user = user),
      tap(() => this.spinnerToggle = false)
    ).subscribe();
  };

  editName() {
    this.nickNameEdit = !this.nickNameEdit;
  }

  async updateName() {
    this.spinnerToggle = true;
    try {
      await this.userService.updateName(this.newNickName);
      this.spinnerToggle = false;
      this.editName();

    } catch (error) {
      console.log(error); this.spinnerToggle = false;
    };
  };

  chooseImage(event) {
    this.spinnerToggle = true;
    this.selectedFile = event.target.files;
    if (this.selectedFile.item(0)) {
      this.userService.updateProfilePic(this.selectedFile.item(0));
      this.spinnerToggle = false;
    };
  };



}
