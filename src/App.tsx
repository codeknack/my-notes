import { useState } from 'react'
import Markdown from 'marked-react'

import { ThemeIcon, Button, CloseButton, Switch, NavLink, Flex, Grid, Divider, Paper, Text, TextInput, Textarea } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { IconNotebook, IconFilePlus, IconFileArrowLeft, IconFileArrowRight } from '@tabler/icons'

import { save, open, ask } from '@tauri-apps/api/dialog'
import { writeTextFile, readTextFile } from '@tauri-apps/api/fs'
import { sendNotification } from '@tauri-apps/api/notification'

function App() {
  const [notes, setNotes] = useLocalStorage({ key: "my-notes", defaultValue: [  {
    "title": "New note",
    "content": ""
  }] })

  const [active, setActive] = useState(0)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [checked, setChecked] = useState(false)

  const handleSelection = (title: string, content: string, index: number) => {
    setTitle(title)
    setContent(content)
    setActive(index)
  }

  const addNote = () => {
    notes.splice(0, 0, {title: "New note", content: ""})
    handleSelection("New note", "", 0)
    setNotes([...notes])
  }

  const deleteNote = async (index: number) => {
    let deleteNote = await ask("Are you sure you want to delete this note?", {
      title: "My Notes",
      type: "warning",
    })
    if (deleteNote) {
      notes.splice(index,1)
      if (active >= index) {
        setActive(active >= 1 ? active - 1 : 0)
      }
      if (notes.length >= 1) {
        setContent(notes[index-1].content)
      } else {
        setTitle("")
        setContent("")
      } 
      setNotes([...notes]) 
    }
  }

  const updateNoteTitle = ({ target: { value } }: { target: { value: string } }) => {
    notes.splice(active, 1, { title: value, content: content })
    setTitle(value)
    setNotes([...notes])
  }
  
  const updateNoteContent = ({target: { value } }: { target: { value: string } }) => {
    notes.splice(active, 1, { title: title, content: value })
    setContent(value)
    setNotes([...notes])
  }

  const exportNotes = async () => {
    const exportedNotes = JSON.stringify(notes)
    const filePath = await save({
      filters: [{
        name: "JSON",
        extensions: ["json"]
      }]
    })
    await writeTextFile(`${filePath}`, exportedNotes)
    sendNotification(`Your notes have been successfully saved in ${filePath} file.`)
  }

  const importNotes = async () => {
    const selectedFile = await open({
      filters: [{
        name: "JSON",
        extensions: ["json"]
      }]
    })
    const fileContent = await readTextFile(`${selectedFile}`)
    const importedNotes = JSON.parse(fileContent)
    setNotes(importedNotes)
  }

  return (
    <div>
      <Grid grow m={10}>
        <Grid.Col span="auto">
          <Flex gap="xl" justify="flex-start" align="center" wrap="wrap">
            <Flex>
              <ThemeIcon size="lg" variant="gradient" gradient={{ from: "teal", to: "lime", deg: 90 }}>
                <IconNotebook size={32} />
              </ThemeIcon>
              <Text color="green" fz="xl" fw={500} ml={5}>My Notes</Text>
            </Flex>
            <Button onClick={addNote} leftIcon={<IconFilePlus />}>Add note</Button>
            <Button.Group>
              <Button variant="light" onClick={importNotes} leftIcon={<IconFileArrowLeft />}>Import</Button>
              <Button variant="light" onClick={exportNotes} leftIcon={<IconFileArrowRight />}>Export</Button>
            </Button.Group>
          </Flex>

          <Divider my="sm" />

          {notes.map((note, index) => (
            <Flex key={index}>
              <NavLink onClick={() => handleSelection(note.title, note.content, index)} active={index === active} label={note.title} />
              <CloseButton onClick={() => deleteNote(index)} title="Delete note" size="xl" iconSize={20} />
            </Flex>
          ))} 
        </Grid.Col>
        <Grid.Col span={2}>
          <Switch label="Toggle Editor / Markdown Preview"  checked={checked} onChange={(event) => setChecked(event.currentTarget.checked)}/>

          <Divider my="sm" />

          {checked === false && (
            <div>
              <TextInput value={title} onChange={updateNoteTitle} mb={5} />
              <Textarea value={content} onChange={updateNoteContent} minRows={10} />
            </div>
          )}
          {checked && (
            <Paper shadow="lg" p={10}>
              <Text fz="xl" fw={500} tt="capitalize">{title}</Text>

              <Divider my="sm" />

              <Markdown>{content}</Markdown>
            </Paper>
          )}
        </Grid.Col>
      </Grid>
    </div>
  )
}

export default App
