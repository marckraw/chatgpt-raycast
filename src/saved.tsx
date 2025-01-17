import { Action, ActionPanel, Alert, confirmAlert, Icon, List, LocalStorage, showToast, Toast } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import say from "say";
import { AnswerDetailView } from "./answer-detail";
import { Answer } from "./type";

export default function SavedAnswer() {
  const [savedAnswers, setSavedAnswers] = useState<Answer[]>([]);
  const [searchText, setSearchText] = useState<string>("");

  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const storedSavedAnswers = await LocalStorage.getItem<string>("savedAnswers");

      if (!storedSavedAnswers) {
        setSavedAnswers([]);
      } else {
        const answers: Answer[] = JSON.parse(storedSavedAnswers);
        setSavedAnswers((previous) => [...previous, ...answers]);
      }
    })();
  }, []);

  useEffect(() => {
    LocalStorage.setItem("savedAnswers", JSON.stringify(savedAnswers));
  }, [savedAnswers]);

  const handleUnsaveAnswer = useCallback(
    async (answer: Answer) => {
      const toast = await showToast({
        title: "Unsaving your answer...",
        style: Toast.Style.Animated,
      });
      const newSavedAnswer = savedAnswers.filter((savedAnswer) => savedAnswer.id !== answer.id);
      setSavedAnswers(newSavedAnswer);
      toast.title = "Answer unsaved!";
      toast.style = Toast.Style.Success;
    },
    [setSavedAnswers, savedAnswers]
  );

  const getActionPanel = (answer: Answer) => (
    <ActionPanel>
      <Action.CopyToClipboard icon={Icon.CopyClipboard} title="Copy Answer" content={answer.answer} />
      <Action.CopyToClipboard icon={Icon.CopyClipboard} title="Copy Question" content={answer.question} />
      <Action.CreateSnippet
        icon={Icon.Snippets}
        title="Save as a Snippet"
        snippet={{ text: answer.answer, name: answer.question }}
        shortcut={{ modifiers: ["cmd"], key: "n" }}
      />
      <Action.CopyToClipboard icon={Icon.CopyClipboard} title="Copy ID" content={answer.id} />
      <Action.CopyToClipboard icon={Icon.CopyClipboard} title="Copy Conversation ID" content={answer.conversationId} />

      <Action
        icon={Icon.SpeechBubble}
        title="Speak"
        onAction={() => {
          say.stop();
          say.speak(answer.answer);
        }}
        shortcut={{ modifiers: ["cmd"], key: "p" }}
      />

      <Action
        style={Action.Style.Destructive}
        icon={Icon.Trash}
        title="Remove Answer"
        onAction={async () => {
          await confirmAlert({
            title: "Are you sure you want to remove this answer from your collection?",
            message: "This action cannot be undone.",
            icon: Icon.Trash,
            primaryAction: {
              title: "Remove",
              style: Alert.ActionStyle.Destructive,
              onAction: () => {
                handleUnsaveAnswer(answer);
              },
            },
          });
        }}
        shortcut={{ modifiers: ["cmd"], key: "s" }}
      />
    </ActionPanel>
  );

  const filteredAnswers = savedAnswers.filter((answer) => {
    if (searchText === "") {
      return true;
    }
    return (
      answer.question.toLowerCase().includes(searchText.toLowerCase()) ||
      answer.answer.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  return (
    <List
      isShowingDetail={filteredAnswers.length === 0 ? false : true}
      filtering={false}
      throttle={false}
      navigationTitle={"Saved Answers"}
      selectedItemId={selectedAnswerId || undefined}
      onSelectionChange={(id) => {
        if (id !== selectedAnswerId) {
          setSelectedAnswerId(id);
        }
      }}
      searchBarPlaceholder="Search saved answers/question..."
      searchText={searchText}
      onSearchTextChange={setSearchText}
    >
      {savedAnswers.length === 0 ? (
        <List.EmptyView title="No saved answers" icon={Icon.Stars} />
      ) : (
        <List.Section title="Saved" subtitle={filteredAnswers.length.toLocaleString()}>
          {filteredAnswers
            .sort((a, b) => new Date(b.savedAt ?? 0).getTime() - new Date(a.savedAt ?? 0).getTime())

            .map((answer) => (
              <List.Item
                id={answer.id}
                key={answer.id}
                title={answer.question}
                accessories={[{ text: new Date(answer.createdAt ?? 0).toLocaleDateString() }]}
                detail={<AnswerDetailView answer={answer} />}
                actions={answer && selectedAnswerId === answer.id ? getActionPanel(answer) : undefined}
              />
            ))}
        </List.Section>
      )}
    </List>
  );
}
