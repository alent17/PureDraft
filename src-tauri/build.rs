fn main() {
    println!("cargo::rustc-check-cfg=cfg(mobile)");
    
    #[cfg(target_os = "windows")]
    {
        println!("cargo:rustc-link-arg=/SUBSYSTEM:WINDOWS");
        println!("cargo:rustc-link-arg=/ENTRY:mainCRTStartup");
    }
    
    tauri_build::build();
}