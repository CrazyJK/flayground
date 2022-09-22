package jk.kamoru.flayground.info;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.TreeMap;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.core.exc.StreamReadException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DatabindException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.info.domain.Actress;

public class ActressDuplicationChecker {

  final File infoFile = new File("K:\\Crazy\\Info", Flayground.InfoFilename.ACTRESS);
  final File infoSortedFile = new File("K:\\Crazy\\Info", Flayground.InfoFilename.ACTRESS + ".sorted");
  final File infoCheckeddFile = new File("K:\\Crazy\\Info", Flayground.InfoFilename.ACTRESS + ".checked");

  @Test
  void test() throws StreamReadException, DatabindException, IOException {
    ObjectMapper jsonReader = new ObjectMapper();
    ObjectWriter jsonWriter = new ObjectMapper().writerWithDefaultPrettyPrinter();

    List<Actress> list = jsonReader.readValue(infoFile, new TypeReference<List<Actress>>() {});

    List<Actress> sortedList = list.stream().sorted((a1, a2) -> a1.getName().trim().compareTo(a2.getName().trim())).toList();

    jsonWriter.writeValue(infoSortedFile, sortedList);

    Map<String, List<Actress>> map = new TreeMap<>();
    for (Actress actress : list) {
      String name = actress.getName().trim();
      if (map.containsKey(name)) {
        map.get(name).add(actress);
        // System.out.println(actress);
      } else {
        List<Actress> actressList = new ArrayList<>();
        actressList.add(actress);
        map.put(name, actressList);
      }
    }
    // System.out.println(map.size());

    List<Actress> checkedList = new ArrayList<>();

    int count = 0;
    for (Entry<String, List<Actress>> entry : map.entrySet()) {
      List<Actress> actressList = entry.getValue();
      if (actressList.size() > 1) {
        ++count;
        for (Actress actress : actressList) {
          int firstChar = (int) actress.getName().charAt(0);
          if (firstChar != 32) {
            System.out.format("%3s %-20s %s %s%n", count, actress.getName(), firstChar, actress);
            checkedList.add(actress);
          }
        }
      } else {
        checkedList.add(actressList.get(0));
      }
    }

    jsonWriter.writeValue(infoCheckeddFile, checkedList);
  }

}
