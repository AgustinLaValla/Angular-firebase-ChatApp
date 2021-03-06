import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import * as firebase from 'firebase';
import { Subject, of, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { filter, map, tap } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { Friend } from '../interface/friend.interface';
import { IUser } from '../interface/user.interface';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  public friendsCollection: AngularFirestoreCollection
  public friendsCollTrigger = new Subject<string>();
  public docId: string;

  private currentUser: firebase.User;

  constructor(
    private authService: AuthService,
    private afs: AngularFirestore
  ) {
    this.currentUserStateListener();
    this.friendsCollection = this.afs.collection('friends');
  }

  currentUserStateListener() {
    this.authService.currentUser.pipe(
      filter(user => !isNullOrUndefined(user)),
      map(user => this.currentUser = user)
    ).subscribe();
  };


  getMyFriends(): Observable<Friend[]> {

    return this.currentUser
      ?
      this.friendsCollection
        .doc(this.currentUser.uid)
        .collection<Friend>('myfriends')
        .valueChanges()
      :
      of([]);
  }


  getFriendList(): Observable<Friend[]> {
    return this.afs.doc(`friends/${this.docId}`).collection<Friend>('myfriends').valueChanges();
  }


  async getFriendsProfiles(emails: Friend[]) {
    let friendsProfiles: IUser[] = [];

    await emails.map(async userEmail => {
      const profiles = await this.afs.collection<IUser>('users').ref.where('email', '==', userEmail.email).get();
      if (!profiles.empty) {
        friendsProfiles.push(profiles.docs[0].data() as IUser);
      };
    });

    return friendsProfiles;
  };

}

