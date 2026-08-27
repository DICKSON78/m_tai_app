import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, info: '' };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string | null }) {
    this.setState({ info: errorInfo.componentStack || '' });
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>M-TAI — Something went wrong</Text>
        <ScrollView style={styles.scroll}>
          <Text style={styles.message}>{String(this.state.error.message || this.state.error)}</Text>
          {this.state.info ? (
            <Text style={styles.stack}>{this.state.info}</Text>
          ) : null}
        </ScrollView>
        <Text style={styles.hint}>Please send this error to the developer.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  scroll: {
    flexGrow: 0,
    maxHeight: '70%',
    width: '100%',
  },
  message: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 12,
  },
  stack: {
    fontSize: 11,
    color: '#6B7280',
  },
  hint: {
    marginTop: 16,
    fontSize: 12,
    color: '#9CA3AF',
  },
});
