import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import * as firebase from 'firebase';
import { FriendsService } from './friends.service';
import { AuthService } from './auth.service';
import { filter, map } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { of, Observable } from 'rxjs';
import { Request } from '../interface/request.interface';
import { MatSnackBar } from '@angular/material';
import { Friend } from '../interface/friend.interface';

@Injectable({
  providedIn: 'root'
})
export class RequestService {

  public requestRef: AngularFirestoreCollection;
  public firendsRef: AngularFirestoreCollection;


  private currentUser: firebase.User;

  constructor(
    private afs: AngularFirestore,
    private authService: AuthService,
    private friendsService: FriendsService,
    private snack: MatSnackBar
  ) {
    this.currentUserStateListener();
    this.requestRef = this.afs.collection<Request>('request');
    this.firendsRef = this.afs.collection<Friend>('friends')
  }

  currentUserStateListener() {

    this.authService.currentUser.pipe(
      filter(user => !isNullOrUndefined(user)),
      map(user => this.currentUser = user)
    ).subscribe();
  };

  async addRequest(requestedUserEmail: string) {
    try {
      await this.requestRef.add({
        sender: this.currentUser.email,
        receiver: requestedUserEmail
      });
      this.snack.open('Request sent', 'Okay', { duration: 3000 })
    } catch (error) {
      console.log(error);
    };
  };

  getMyRequest(): Observable<Request[]> {
    if (this.currentUser) {
      return this.afs.collection<Request>('request', ref => ref.where('receiver', '==', this.currentUser.email))
        .valueChanges();
    };
    return of([]);
  };


  async acceptRequest(requester: Friend) {
    const friendsCollection = await this.firendsRef.ref.where('email', '==', this.currentUser.email).get();
    if (friendsCollection.empty) {
      const docRef = await this.firendsRef.add({ email: this.currentUser.email });
      await this.firendsRef.doc(docRef.id).collection('myfriends').add({ email: requester.email })
      await this.friendsService.getMyFriends();
    } else {
      this.afs.doc(`friends/${friendsCollection.docs[0].id}`).collection('myfriends').add({ email: requester.email });
    };

    const requesterFriendsColl = await this.firendsRef.ref.where('email', '==', requester.email).get();
    if (requesterFriendsColl.empty) {
      const docRef = await this.firendsRef.add({ email: requester.email });
      await this.firendsRef.doc(docRef.id).collection('myfriends').add({ email: this.currentUser.email });
      await this.friendsService.getMyFriends();
    } else {
      this.afs.doc(`friends/${requesterFriendsColl.docs[0].id}`).collection('myfriends').add({ email: this.currentUser.email });
    };

    await this.deleteRequest(requester);
  };

  async deleteRequest(req: Friend) {
    const requestColl = await this.requestRef.ref.where('sender', '==', req.email).where('receiver', '==', this.currentUser.email).get();
    requestColl.docs[0].ref.delete();
  };

  getSentRequests(): Observable<Request[]> {
    return this.afs.collection<Request>('request', ref => ref.where('sender', '==', this.currentUser.email))
      .valueChanges();
  };

}

