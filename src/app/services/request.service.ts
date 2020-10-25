import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import * as firebase from 'firebase';
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
  public friendsRef: AngularFirestoreCollection;

  private currentUser: firebase.User;

  constructor(
    private afs: AngularFirestore,
    private authService: AuthService,
    private snack: MatSnackBar
  ) {
    this.currentUserStateListener();
    this.requestRef = this.afs.collection<Request>('request');
    this.friendsRef = this.afs.collection<Friend>('friends')
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
    const friendsCollection = await this.friendsRef.doc(this.currentUser.uid).get().toPromise();
    if (!friendsCollection.exists) {
      await this.friendsRef.doc(this.currentUser.uid).set({ email: this.currentUser.email, id: this.currentUser.uid });
      await this.friendsRef.doc(this.currentUser.uid).collection('myfriends').doc(requester.id).set({ email: requester.email, id: requester.id })
    } else {
      await this.afs.doc(`friends/${friendsCollection.id}`).collection('myfriends').doc(requester.id).set({ email: requester.email, id: requester.id });
    };

    const requesterFriendsColl = await this.friendsRef.doc(requester.id).get().toPromise();
    if (!requesterFriendsColl.exists) {
      await this.friendsRef.doc(requester.id).set({ email: requester.email, id: requester.id });
      await this.friendsRef.doc(requester.id).collection('myfriends').doc(this.currentUser.uid).set({ email: this.currentUser.email, id: this.currentUser.uid });
    } else {
      await this.afs.doc(`friends/${requesterFriendsColl.id}`).collection('myfriends').doc(this.currentUser.uid).set({ email: this.currentUser.email, id: this.currentUser.uid });
    };


    await this.deleteRequest(requester);
  };

  async deleteRequest(req: Friend) {
    const requestColl = await this.requestRef.ref.where('sender', '==', req.email).where('receiver', '==', this.currentUser.email).get();
    await requestColl.docs[0].ref.delete();
  };

  getSentRequests(): Observable<Request[]> {
    return this.afs.collection<Request>('request', ref => ref.where('sender', '==', this.currentUser.email))
      .valueChanges();
  };

}

