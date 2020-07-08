import { Pipe, PipeTransform } from '@angular/core';
const epochs: any[] = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['seconds', 1]
]

// interface Epoch {[index:number]: Array<string|number>}

@Pipe({
  name: 'relativeDate'
})
export class RelativeDatePipe implements PipeTransform {

  getDuration(timeAgoInSeconds: number) {
    for(let [name,seconds] of epochs) { 
      let interval = Math.floor((timeAgoInSeconds/1000) / seconds);
      if( interval >=1 ) {
        return { 
          interval:interval,
          epoch: name
        };
      }
    }
    return{
      interval: 0,
      epoch: 'second'
    };
  }

  transform(dateStamp: number): string {
    let timeAgoInSeconds = Math.floor((new Date().getTime() - new Date(dateStamp).getTime()));
    let {interval, epoch} = this.getDuration(timeAgoInSeconds);
    let suffix = interval === 1 ? '': 's'
    return `${interval} ${epoch}${suffix}`;
  }

}
