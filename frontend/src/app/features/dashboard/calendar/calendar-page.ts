import { Component } from '@angular/core';
import {
  DateAdapter,
  provideCalendar,
  CalendarEvent,
  CalendarView,
  CalendarWeekViewComponent,
} from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

@Component({
  selector: 'app-calendar',
  imports: [CalendarWeekViewComponent],
  providers: [
    provideCalendar({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
  ],
  templateUrl: './calendar-page.html',
})
export class CalendarPage {
  readonly CalendarView = CalendarView;
  view: CalendarView = CalendarView.Week;
  viewDate = new Date();
  events: CalendarEvent[] = [
    {
      start: new Date(),
      title: 'An event',
    },
  ];

  setView(view: CalendarView) {
    this.view = view;
  }
}
