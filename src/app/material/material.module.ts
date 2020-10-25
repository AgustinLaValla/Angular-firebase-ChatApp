import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    MatButtonModule,
    MatCheckboxModule,
    MatLineModule,
    MatListModule,
    MatExpansionModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatTabsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule
}
    from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';

const MaterialComponents = [
    MatButtonModule,
    MatCheckboxModule,
    MatLineModule,
    MatListModule,
    MatExpansionModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatTabsModule,
    MatSnackBarModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule
]

@NgModule({
    imports: [MaterialComponents, CommonModule, FlexLayoutModule],
    exports: [MaterialComponents, FlexLayoutModule],
})
export class MaterialModule { }
