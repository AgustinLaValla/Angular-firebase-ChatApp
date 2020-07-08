import { Pipe, PipeTransform } from '@angular/core';
import { RelativeDatePipe } from './relative-date.pipe';
const secondsInADay:number = 86400;

@Pipe({
  name: 'smathDate'
})
export class SmathDatePipe implements PipeTransform {

  transform(dateStamp: any, relativeMax: number = 10): string {
    let timeAgoInSecons = Math.floor((Date.now() - dateStamp / 1000));
    if(timeAgoInSecons > relativeMax * secondsInADay) { 
      return new RelativeDatePipe().transform(dateStamp);
    }else{
      return new Date(dateStamp).toLocaleDateString('en-GB')
    }
  }

}
