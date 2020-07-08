import { NgModule } from '@angular/core';

import { DashboardComponent } from './dashboard.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ProfileComponent } from '../profile/profile.component';
import { AddFriendsComponent } from '../add-friends/add-friends.component';
import { RequestComponent } from '../request/request.component';
import { MyFriendsComponent } from '../my-friends/my-friends.component';
import { ChatFeedComponent } from '../chat-feed/chat-feed.component';
import { FooterComponent } from '../footer/footer.component';
import { SmathDatePipe } from 'src/app/pipes/smath-date.pipe';
import { RelativeDatePipe } from 'src/app/pipes/relative-date.pipe';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { ScrollableDirective } from 'src/app/directives/scrollable.directive';
import { ActivityComponent } from '../activity/activity.component';
import { FriendInfoComponent } from '../friend-info/friend-info.component';
import { MyGroupsComponent } from '../my-groups/my-groups.component';
import { GroupMenuComponent } from '../group-menu/group-menu.component';
import { AddMemberComponent } from '../add-member/add-member.component';
import { GroupFooterComponent } from '../group-footer/group-footer.component';
import { NotificationsComponent } from '../notifications/notifications.component';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardRoutingModule } from './dashboard-routing.module';

@NgModule({

    declarations: [
        DashboardComponent,
        NavbarComponent,
        SidebarComponent,
        ProfileComponent,
        AddFriendsComponent,
        RequestComponent,
        MyFriendsComponent,
        ChatFeedComponent,
        FooterComponent,
        SmathDatePipe,
        RelativeDatePipe,
        LoadingSpinnerComponent,
        ScrollableDirective,
        ActivityComponent,
        FriendInfoComponent,
        MyGroupsComponent,
        GroupMenuComponent,
        AddMemberComponent,
        GroupFooterComponent,
        NotificationsComponent
    ],
    imports: [
        CommonModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        DashboardRoutingModule
    ],
    exports: [
        MaterialModule,
    ],

    entryComponents: [
        LoadingSpinnerComponent,
        AddMemberComponent,
    ]

})
export class DashboardModule { }
