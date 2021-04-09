import {UPDATE_MEETINGS} from './constants';

export const updateMeetings = (meetings) => ({
  type: UPDATE_MEETINGS,
  value: meetings
});