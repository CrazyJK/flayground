package jk.kamoru.flayground;

import java.io.File;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import org.apache.commons.lang3.BooleanUtils;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Data
@Configuration
@ConfigurationProperties(prefix = "flay")
public class FlayProperties {

  private Backup backup = new Backup();
  private Score score = new Score();

  private boolean deleteLowerScore = false;
  private int storageLimit = 7168;

  private File archivePath;
  private File storagePath;
  private File[] stagePaths;
  private File coverPath;
  private File queuePath;
  private File candidatePath;
  private File subtitlesPath;
  private File infoPath;
  private File[] todayisPaths;
  private File[] imagePaths;
  private File backupPath;

  private File playerApp;
  private File editorApp;
  private File paintApp;

  private File attachPath;
  private File diaryPath;

  private String recyclebin = "FLAY_RECYCLEBIN";
  private boolean recyclebinUse = true;

  private List<String> automaticallyCertificatedIp;

  private boolean useTorProxy = false;
  private int jsoupTimeout = 60;

  @JsonIgnore
  public Boolean negateDeleteLowerScore() {
    deleteLowerScore = BooleanUtils.negate(deleteLowerScore);
    return deleteLowerScore;
  }

  @Data
  public static class Backup {
    private String instanceJarFilename = "flayground-instance.jar";
    private String archiveJarFilename = "flayground-archive.jar";
    private String instanceCsvFilename = "flay-instance.csv";
    private String archiveCsvFilename = "flay-archive.csv";
  }

  @Data
  public static class Score {
    private int rankPoint = 20;
    private int playPoint = 1;
    private int subtitlesPoint = 30;
    private int favoritePoint = 30;
  }

  protected static List<String> getSiteLocalAddresses() {
    List<String> serverIPs = new ArrayList<>();
    serverIPs.add("localhost");
    try {
      Enumeration<NetworkInterface> networkInterfaces = NetworkInterface.getNetworkInterfaces();
      while (networkInterfaces.hasMoreElements()) {
        NetworkInterface networkInterface = networkInterfaces.nextElement();
        log.debug(String.format("NetworkInterface: %-5s %-4s %-8s %-7s %-50s",
            networkInterface.getName(),
            networkInterface.isUp() ? "up" : "down",
            networkInterface.isLoopback() ? "loopback" : "",
            networkInterface.isVirtual() ? "virtual" : "",
            networkInterface.getDisplayName()));

        if (networkInterface.isUp()) {
          System.out.println();
          System.out.format("\t NetworkInterface: %-5s [%s]%n", networkInterface.getName(), networkInterface.getDisplayName());

          Enumeration<InetAddress> inetAddresses = networkInterface.getInetAddresses();
          while (inetAddresses.hasMoreElements()) {
            InetAddress inetAddress = inetAddresses.nextElement();

            // interface is up and not loopback, inetaddress is SiteLocal
            if (networkInterface.isUp() && (networkInterface.isLoopback() || inetAddress.isSiteLocalAddress())) {
              serverIPs.add(inetAddress.getHostAddress());
            }

            System.out.format("\t    └ InetAddress: %-9s %-15s %s%n",
                inetAddress.isLoopbackAddress() ? "Loopback" : inetAddress.isLinkLocalAddress() ? "LinkLocal" : inetAddress.isSiteLocalAddress() ? "SiteLocal" : "unknown",
                inetAddress.getHostName(),
                inetAddress.getHostAddress());
          }
        }
      }
      System.out.println();
    } catch (SocketException e) {
      log.error("Fail to obtain System Ip", e);
    }
    log.info("Server IP is {}", serverIPs);
    return serverIPs;
  }

}
