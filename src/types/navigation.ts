export type RootStackParamList = {
  Main: undefined;
  RecordingDetail: {
    recordingId: string;
  };
  DocumentDetail: {
    documentId: string;
  };
  Subscription: undefined;
};

export type TabParamList = {
  Overview: undefined;
  Recordings: undefined;
  Documents: undefined;
  'AI Chat': undefined;
  Subscription: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}