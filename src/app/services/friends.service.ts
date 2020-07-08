import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase';
import { Subject, BehaviorSubject, of, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { filter, map } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { Friend } from '../interface/friend.interface';
import { IUser } from '../interface/user.interface';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  public friendsCollection: AngularFirestoreCollection
  public friendsCollTrigger = new Subject<string>();
  public friendProfileTrigger$ = new BehaviorSubject<string>('Exist');
  public docId: string;

  private currentUser: firebase.User;

  constructor(private authService: AuthService, private afs: AngularFirestore) {
    this.currentUserStateListener();
    this.friendsCollection = this.afs.collection('friends');
  }

  currentUserStateListener() {
    this.authService.currentUser.pipe(
      filter(user => !isNullOrUndefined(user)),
      map(user => this.currentUser = user)
    ).subscribe();
  };

  async getMyFriends(): Promise<BehaviorSubject<string>> {

    if (isNullOrUndefined(this.currentUser)) return;
    const snap = await this.friendsCollection.ref.where('email', '==', this.currentUser.email).get();
    if (!snap.empty) {
      this.docId = snap.docs[0].id;
      this.friendProfileTrigger$.next('Exists');
    } else {
      this.friendProfileTrigger$.next('Nothing');
    };
  }


  getFriendList(): Observable<Friend[]> {
    return this.afs.doc(`friends/${this.docId}`).collection<Friend>('myfriends').valueChanges();
  }


  async getFriendsProfiles(emails: Friend[]) {
    let friendsProfiles: IUser[] = [];

    emails.map(async userEmail => {
      const profiles = await this.afs.collection<IUser>('users').ref.where('email', '==', userEmail.email).get();
      if (!profiles.empty) {
        friendsProfiles.push(profiles.docs[0].data() as IUser);
      };
    });

    return friendsProfiles;
  };

}

