
import {createStore} from 'redux';
import reducers from './reducers';

interface State {
  meetings: Array<any>
}

const initialState = <State> {};

const configureStore = (initialStore = <State>{}) => createStore(reducers, initialStore);

export default configureStore(initialState);