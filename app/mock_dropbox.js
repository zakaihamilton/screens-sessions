import { scanDropboxServer } from '../app/dropbox';

export default async function mockScanDropboxServer() {
    return {
        success: true,
        data: {
            "Group A": [
                {
                    id: "id1",
                    name: "2024-05-10 Private Session.mp3",
                    path_lower: "/shared_sessions/group a/2024-05-10 private session.mp3",
                    path_display: "/shared_sessions/Group A/2024-05-10 Private Session.mp3",
                    group: "Group A",
                    year: "2024",
                    destPath: "/sessions/Group A/2024/2024-05-10 Private Session.mp3",
                    isValid: true,
                    validationError: null,
                    spellingWarning: null,
                    privacyWarning: "file name is marked as private",
                    isOld: false,
                    datePart: "2024-05-10",
                    titlePart: "Private Session"
                },
                {
                    id: "id2",
                    name: "2024-05-11 Normal Session.mp3",
                    path_lower: "/shared_sessions/group a/2024-05-11 normal session.mp3",
                    path_display: "/shared_sessions/Group A/2024-05-11 Normal Session.mp3",
                    group: "Group A",
                    year: "2024",
                    destPath: "/sessions/Group A/2024/2024-05-11 Normal Session.mp3",
                    isValid: true,
                    validationError: null,
                    spellingWarning: null,
                    privacyWarning: null,
                    isOld: false,
                    datePart: "2024-05-11",
                    titlePart: "Normal Session"
                }
            ]
        }
    };
}
