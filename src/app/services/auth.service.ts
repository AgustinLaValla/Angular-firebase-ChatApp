import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { constants } from '../constants/constants';
import { isNullOrUndefined } from 'util';
import { Usercreds } from '../interface/usercreds.interface';
import { map, tap, filter } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material';
import * as firebase from 'firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public authState: firebase.User = null;

  public currentUser = new BehaviorSubject<firebase.User>(this.authState);
  public isAuth = new Subject<boolean>();

  constructor(
    public afa: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    private snack: MatSnackBar
  ) { }


  initListener() {
    return this.afa.authState.pipe(
      filter(user => !isNullOrUndefined(user)),
      map(user => this.authState = user),
      tap((user) => {
        if (!isNullOrUndefined(user)) this.currentUser.next(user);
      })
    );
  }

  //CHECK AUTH
  getCurrentUser() {
    return !isNullOrUndefined(this.authState);
  }

  //Return details of singed in user
  currentUserDetails(): firebase.User {
    return this.authState;
  }

  get currentUserId(): string {
    return !isNullOrUndefined(this.authState) ? this.authState.uid : null;
  }

  //Crear cuenta
  async singUp(usercreds: Usercreds) {
    try {
      const user = await this.afa.auth.createUserWithEmailAndPassword(usercreds.email, usercreds.password);
      await this.afa.auth.currentUser.updateProfile({ displayName: usercreds.displayname, photoURL: constants.PROFILE_PIC });
      await this.setUserData(usercreds.email, usercreds.displayname, user.user.photoURL, user.user.uid);
      await this.incrementUserCounter();
    } catch (error) {
      this.snack.open(error.message, 'Close', { duration: 3000 });
    }
  }

  //Set user data into a local user Collection
  async setUserData(email: string, displayName: string, photoURL: string, id: string) {

    await this.afs.doc(`users/${id}`).set({
      email: email,
      displayName: displayName,
      photoURL: photoURL,
      id:id
    });
    await this.afs.doc<Status>(`status/${id}`).set({
      email: email,
      status: 'online'
    });

    this.router.navigate(['']);
  }

  async incrementUserCounter() {
    const counterDoc = await this.afs.collection('counter').doc('-- users counter --').get().toPromise();
    if(!counterDoc.exists) {
      this.afs.collection('counter').doc('-- users counter --').set({totalUsers: 1});
    } else {
      this.afs.collection('counter').doc('-- users counter --').update({totalUsers: firebase.firestore.FieldValue.increment(1)});
    }
  }

  async singIn(usercreds: Usercreds) {
    try {
      await this.afa.auth.signInWithEmailAndPassword(usercreds.email, usercreds.password);
      const status = 'online';
      await this.setUserStatus(status);

    } catch (error) {
      if (error.code == 'auth/user-not-found') {
        this.snack.open('User not found', 'Close', { duration: 3000 })
      } else if (error.code == 'auth/wrong-password') {
        this.snack.open('Wrong password', 'Close', { duration: 3000 })
      }
    }

  }

  //Sets the user status to online/offline
  async setUserStatus(status: string) {
    const data: Partial<Status> = { status: status };
    this.authState.uid;
    await this.afs.doc<Status>(`status/${this.authState.uid}`).update(data);
  }

  //logout function
  async logout() {
    try {
      this.router.navigate(['/login']);
      await this.setUserStatus('offline');
      setTimeout(async () => await this.afa.auth.signOut(), 1000);
    } catch (error) {
      console.log(error);
    };
  };
};

interface Status {
  email: string;
  status: string
}