import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './services/auth.guard';
import { NgModule } from '@angular/core';

const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./components/dashboard/dashboard.module').then(m => m.DashboardModule),
        canActivate: [AuthGuard]
    },
    { path: 'login', loadChildren: () => import('./components/login-page/login.module').then(m => m.LoginModule) },
    { path:'signup', loadChildren: () => import ('./components/singup-page/signup.module').then(m => m.SignupModule) },
    { path: '**', pathMatch: 'full', redirectTo:'login' }

];


@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})

export class AppRoutingModule { }