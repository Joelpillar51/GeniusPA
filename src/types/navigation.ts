export type RootStackParamList = {
  Main: undefined;
  RecordingDetail: {
    recordingId: string;
  };
  DocumentDetail: {
    documentId: string;
  };
};

export type TabParamList = {
  Recordings: undefined;
  Documents: undefined;
  'AI Chat': undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}