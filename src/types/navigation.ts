export type RootStackParamList = {
  Main: undefined;
  RecordingDetail: {
    recordingId: string;
  };
  DocumentDetail: {
    documentId: string;
  };
  Profile: undefined;
  Subscription: undefined;
  DocumentChat: undefined;
};

export type TabParamList = {
  Overview: undefined;
  Recordings: undefined;
  Documents: undefined;
  'AI Chat': undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}