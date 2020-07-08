import { NgModule } from '@angular/core';

import { SingupPageComponent } from './singup-page.component';
import { MaterialModule } from 'src/app/material/material.module';
import { SignupRoutingModule } from './signup-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@NgModule({
    imports: [MaterialModule, SignupRoutingModule, ReactiveFormsModule, CommonModule],
    exports: [],
    declarations: [SingupPageComponent],
    providers: [],
})
export class SignupModule { }
