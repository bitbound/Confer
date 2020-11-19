import React from 'react';
import { EventEmitterEx } from '../utils/EventEmitterEx';

interface ViewModel<T> {
  stateUpdated: EventEmitterEx<T>;
}

interface ViewComponentProps<T extends ViewModel<T>> {
    viewModel: T;
    viewContext: React.Context<T>;
 }


export class ViewComponent<T extends ViewModel<T>> extends React.Component<ViewComponentProps<T>, T> {
  constructor(props: ViewComponentProps<T>) {
    super(props);
    this.state = props.viewModel;
    this.state.stateUpdated.subscribe((updatedViewModel) => {
      this.setState({
        ...updatedViewModel
      })
    });
  }
  render() {
    const ViewContext = React.createContext(this.state);
    return (
       <ViewContext.Provider value={this.state}>
         {this.props.children}
       </ViewContext.Provider>
    )
  }
}