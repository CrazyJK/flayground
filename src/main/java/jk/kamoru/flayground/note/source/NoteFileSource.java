package jk.kamoru.flayground.note.source;

import java.io.File;
import java.io.IOException;
import java.util.Comparator;
import java.util.List;

import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

import jakarta.annotation.PostConstruct;
import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.note.domain.Note;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Repository
public class NoteFileSource implements NoteSource {

  @Autowired FlayProperties flayProperties;

  ObjectMapper jsonReader = new ObjectMapper();
  ObjectWriter jsonWriter = new ObjectMapper().writerWithDefaultPrettyPrinter();

  List<Note> list;

  /**
   * json 변환 type reference
   * @return
   */
  TypeReference<List<Note>> getTypeReference() {
    return new TypeReference<List<Note>>() {};
  }

  File getInfoFile() {
    return new File(flayProperties.getInfoPath(), Flayground.InfoFilename.NOTE);
  }

  @PostConstruct
  void load() {
    File infoFile = getInfoFile();
    try {
      list = jsonReader.readValue(infoFile, getTypeReference());
      log.info(String.format("%5s %-7s - %s", list.size(), FilenameUtils.getBaseName(infoFile.getName()), getInfoFile()));
    } catch (IOException e) {
      throw new IllegalStateException("Fail to load note file " + infoFile, e);
    }
  }

  synchronized void save() {
    try {
      jsonWriter.writeValue(getInfoFile(), list);
    } catch (IOException e) {
      throw new IllegalStateException("Fail to save note file " + getInfoFile(), e);
    }
  }

  @Override
  public Note get(Note note) {
    for (Note n : list) {
      if (n.getId() == note.getId()) {
        return n;
      }
    }
    throw new NoteNotfoundException(note);
  }

  @Override
  public List<Note> list() {
    return list.stream().sorted(Comparator.comparing(Note::getId).reversed()).toList();
  }

  @Override
  public void save(Note note) {
    try {
      Note foundNote = get(note);
      list.remove(foundNote);
    } catch (NoteNotfoundException ignore) {
    }
    list.add(note);
    save();
  }

  @Override
  public void delete(Note note) {
    Note foundNote = get(note);
    list.remove(foundNote);
    save();
  }

}
