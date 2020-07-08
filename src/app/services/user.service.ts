import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import * as firebase from 'firebase';
import { map, filter, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { isNullOrUndefined } from 'util';
import { IUser } from '../interface/user.interface';
import { Observable } from 'rxjs';
import { Status } from '../interface/status.interface';
import { Friend } from '../interface/friend.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public statusUpdate = new BehaviorSubject<string>('Nope')
  private currentUser: firebase.User;

  constructor(
    private afa: AngularFireAuth,
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private authService: AuthService
  ) {
    this.currentUserStateListener();
  }

  currentUserStateListener(): void {
    this.authService.currentUser.pipe(
      filter(user => !isNullOrUndefined(user)),
      map(user => this.currentUser = user)
    ).subscribe();
  };

  async updateName(new_name: string): Promise<void> {

    try {
      await this.authService.afa.auth.currentUser.updateProfile({ displayName: new_name });
      await this.afs.doc('users/' + this.currentUser.uid).update({ displayName: new_name });
    } catch (error) {
      console.log(error);
    }
  }

  async updateProfilePic(file): Promise<void> {

    await this.storage.upload('profilepics/' + this.afa.auth.currentUser.uid, file);
    const downloadURL = await this.storage.ref('profilepics/' + this.afa.auth.currentUser.uid).getDownloadURL().toPromise();
    await this.afs.doc('users/' + this.afa.auth.currentUser.uid).update({ photoURL: downloadURL });
    await this.afa.auth.currentUser.updateProfile({ photoURL: downloadURL });
  }

  getAllUsers(): Observable<IUser[]> {
    return this.afs.collection<IUser>('users').valueChanges().pipe(
      map(users => users.filter(user => user['email'] != this.currentUser.email))
    );
  }

  getUsers(request: any[]) {
    return this.afs.collection('users').valueChanges().pipe(
      map(users => {
        let senderEmails = [];
        request.map(req => senderEmails.push(req['sender']))
        let usersReq = [];
        for (let i = 0; i < users.length; i++) {
          for (let f = 0; f < senderEmails.length; f++) {
            if (users[i]['email'] == senderEmails[f]) {
              usersReq.push(users[i]);
            }
          }
        }
        return usersReq;
      })
    )
  }
  //Instant search for add friend component
  instantSearch(startValue, endValue): Observable<IUser[]> {
    return this.afs.collection<IUser>('users', ref => ref.orderBy('displayName').startAt(startValue)
      .endAt(endValue)).valueChanges();
  }


  async getUsersStatus(users: Array<Friend | IUser>) {
    let friendStatus: Status[] = [];
    users.map(async (user, idx) => {
      const status = await this.afs.collection<Status>('status').ref.where('email', '==', user.email).get();
        friendStatus.push(status.docs[0].data() as Status);
    });
    return friendStatus;
  };

  updateUserStatuses() {
    return this.afs.collection('status').valueChanges().pipe(
      filter(data => data.length > 0),
      tap(() => this.statusUpdate.next('StatusUpdated'))
    );


  }
}
