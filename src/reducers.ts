import {combineReducers} from 'redux';
import {UPDATE_MEETINGS} from './constants';


const meetings = (state={}, action) => {
  switch(action) {
    case UPDATE_MEETINGS:
      return action.value
    default:
      return state;
  }
}

export default combineReducers({meetings});