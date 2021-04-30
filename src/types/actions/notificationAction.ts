export interface NotificationAction {
  type: "notification";
  title: string;
  text: string;
  modifiers?: string;
  action?: Action[];
}
